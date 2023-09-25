import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as docker from '@pulumi/docker';

const IMAGE_NAME = 'compute-engine-app';
const REVISION = 18;
const PORT = 3000;
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${IMAGE_NAME}:${REVISION}`;
const START_TIME_SEC = 30;

const image = new docker.Image(IMAGE_NAME, {
  imageName: pulumi.interpolate`${IMAGE_REPOSITORY}`,
  build: {
    context: '../app',
    platform: 'linux/amd64',
  },
});

// VPC
const network = new gcp.compute.Network('network', {
  autoCreateSubnetworks: false,
});

const subnet = new gcp.compute.Subnetwork('subnet', {
  ipCidrRange: '10.0.1.0/24',
  network: network.id,
});

new gcp.compute.Firewall('firewall', {
  network: network.selfLink,
  allows: [
    {
      protocol: 'tcp',
      ports: ['22', '80', '3000'],
    },
  ],
  direction: 'INGRESS',
  sourceRanges: ['0.0.0.0/0'],
});

const startupScript = `
  #!/bin/bash
  sudo useradd -m linhvuvan2022
  sudo -u linhvuvan2022 docker-credential-gcr configure-docker
  sudo groupadd docker
  sudo usermod -aG docker linhvuvan2022
  sudo -u linhvuvan2022 docker run --name ${IMAGE_NAME} -d -p ${PORT}:3000 ${IMAGE_REPOSITORY}
  sudo -u linhvuvan2022 docker logs -f ${IMAGE_NAME}
`;

new gcp.compute.Instance('instance', {
  machineType: 'e2-micro',
  zone: 'us-central1-a',
  metadataStartupScript: startupScript,
  bootDisk: {
    initializeParams: {
      image: 'projects/cos-cloud/global/images/family/cos-stable',
    },
  },
  networkInterfaces: [
    {
      network: network.id,
      subnetwork: subnet.id,
      accessConfigs: [{}],
    },
  ],
  serviceAccount: {
    email: '819423612556-compute@developer.gserviceaccount.com',
    scopes: [
      'https://www.googleapis.com/auth/devstorage.read_only',
      'https://www.googleapis.com/auth/logging.write',
      'https://www.googleapis.com/auth/monitoring.write',
      'https://www.googleapis.com/auth/service.management.readonly',
      'https://www.googleapis.com/auth/servicecontrol',
      'https://www.googleapis.com/auth/trace.append',
    ],
  },
});

// const startupScript = `
//   #!/bin/bash
//   sudo useradd -m linhvuvan2022
//   sudo -u linhvuvan2022 docker-credential-gcr configure-docker
//   sudo groupadd docker
//   sudo usermod -aG docker linhvuvan2022
//   sudo -u linhvuvan2022 docker run --name ${IMAGE_NAME} -d -p ${PORT}:3000 ${IMAGE_REPOSITORY}
//   sudo -u linhvuvan2022 docker logs -f ${IMAGE_NAME}
// `;

// const template = new gcp.compute.InstanceTemplate('template', {
//   machineType: 'e2-micro',
//   metadataStartupScript: startupScript,
//   disks: [
//     {
//       sourceImage: 'projects/cos-cloud/global/images/family/cos-stable',
//     },
//   ],
//   networkInterfaces: [
//     {
//       network: network.id,
//       subnetwork: subnet.id,
//       accessConfigs: [{}],
//     },
//   ],
//   serviceAccount: {
//     email: '819423612556-compute@developer.gserviceaccount.com',
//     scopes: [
//       'https://www.googleapis.com/auth/devstorage.read_only',
//       'https://www.googleapis.com/auth/logging.write',
//       'https://www.googleapis.com/auth/monitoring.write',
//       'https://www.googleapis.com/auth/service.management.readonly',
//       'https://www.googleapis.com/auth/servicecontrol',
//       'https://www.googleapis.com/auth/trace.append',
//     ],
//   },
// });

// const health = new gcp.compute.HealthCheck('health', {
//   httpHealthCheck: {
//     port: PORT,
//     requestPath: '/healthz',
//   },
// });

// const group = new gcp.compute.RegionInstanceGroupManager('group', {
//   region: 'us-central1',
//   versions: [
//     {
//       instanceTemplate: template.id,
//     },
//   ],
//   baseInstanceName: 'poc-compute-engine',
//   namedPorts: [
//     {
//       name: 'http',
//       port: PORT,
//     },
//   ],
//   autoHealingPolicies: {
//     healthCheck: health.id,
//     initialDelaySec: START_TIME_SEC,
//   },
//   updatePolicy: {
//     type: 'PROACTIVE',
//     minimalAction: 'REPLACE',
//     minReadySec: START_TIME_SEC,
//   },
// });

// new gcp.compute.RegionAutoscaler('autoscaler', {
//   target: group.id,
//   autoscalingPolicy: {
//     cooldownPeriod: START_TIME_SEC,
//     minReplicas: 2,
//     maxReplicas: 2,
//     cpuUtilization: {
//       target: 0.5,
//     },
//   },
// });

// const backend = new gcp.compute.BackendService('backend', {
//   protocol: 'HTTP',
//   healthChecks: health.id,
//   backends: [
//     {
//       group: group.instanceGroup,
//     },
//   ],
// });

// const map = new gcp.compute.URLMap('map', {
//   defaultService: backend.id,
// });

// const proxy = new gcp.compute.TargetHttpProxy('proxy', {
//   urlMap: map.id,
// });

// const { address: ipAddress } = new gcp.compute.GlobalAddress('address');

// new gcp.compute.GlobalForwardingRule('rule', {
//   target: proxy.id,
//   ipAddress,
//   portRange: '80',
// });

export const imageName = image.imageName;
