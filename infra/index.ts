import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as docker from '@pulumi/docker';
import * as yaml from 'yaml';

const APP_NAME = 'compute-engine-app';
const REVISION = 25;
const PORT = 3000;
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:${REVISION}`;
const START_TIME_SEC = 30;
const NUMBER_OF_ZONES = 4;
// const MIN_REPLICAS = 1;
// const MAX_REPLICAS = 1;
const NUMBER_OF_INSTANCES = 0;

const buildMetadata = () => {
  const container = yaml.stringify({
    spec: {
      containers: [
        {
          name: APP_NAME,
          image: IMAGE_REPOSITORY,
          stdin: false,
          tty: false,
        },
      ],
      restartPolicy: 'Always',
    },
  });

  console.log('container', container);

  return {
    'gce-container-declaration': container,
    'google-logging-enabled': 'true',
    'google-logging-use-fluentbit': 'true',
  };
};

const image = new docker.Image(APP_NAME, {
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

const template = new gcp.compute.InstanceTemplate('instance-template', {
  machineType: 'e2-micro',
  metadata: buildMetadata(),
  disks: [
    { sourceImage: 'projects/cos-cloud/global/images/family/cos-stable' },
  ],
  networkInterfaces: [
    {
      network: network.id,
      subnetwork: subnet.id,
      accessConfigs: [{}],
    },
  ],
  // serviceAccount: {
  //   email: '819423612556-compute@developer.gserviceaccount.com',
  //   scopes: ['default'],
  // },
});

const health = new gcp.compute.HealthCheck('health', {
  httpHealthCheck: {
    port: PORT,
    requestPath: '/healthz',
  },
});

const group = new gcp.compute.RegionInstanceGroupManager('group', {
  region: 'us-central1',
  versions: [
    {
      instanceTemplate: template.id,
    },
  ],
  baseInstanceName: APP_NAME,
  namedPorts: [
    {
      name: 'http',
      port: PORT,
    },
  ],
  autoHealingPolicies: {
    healthCheck: health.id,
    initialDelaySec: START_TIME_SEC,
  },
  updatePolicy: {
    type: 'PROACTIVE',
    minimalAction: 'REPLACE',
    minReadySec: START_TIME_SEC,
    maxSurgeFixed: Math.max(NUMBER_OF_INSTANCES, NUMBER_OF_ZONES),
    maxUnavailableFixed: 0,
  },
  targetSize: NUMBER_OF_INSTANCES,
});

// new gcp.compute.RegionAutoscaler('autoscaler', {
//   target: group.id,
//   autoscalingPolicy: {
//     cooldownPeriod: START_TIME_SEC,
//     minReplicas: MIN_REPLICAS,
//     maxReplicas: MAX_REPLICAS,
//     cpuUtilization: {
//       target: 0.5,
//     },
//   },
// });

const backend = new gcp.compute.BackendService('backend', {
  protocol: 'HTTP',
  healthChecks: health.id,
  loadBalancingScheme: 'EXTERNAL_MANAGED',
  backends: [
    {
      group: group.instanceGroup,
    },
  ],
});

const certificate = new gcp.compute.ManagedSslCertificate(
  'managed-ssl-certificate',
  {
    name: 'linhvuvan-com',
    managed: {
      domains: ['linhvuvan.com'],
    },
  },
);

const { address: ipAddress } = new gcp.compute.GlobalAddress('address');

const map = new gcp.compute.URLMap('map', {
  defaultService: backend.id,
});

// https
const httpsProxy = new gcp.compute.TargetHttpsProxy('https-proxy', {
  urlMap: map.id,
  sslCertificates: [certificate.id],
});

new gcp.compute.GlobalForwardingRule('https-rule', {
  target: httpsProxy.id,
  ipAddress,
  portRange: '443',
  loadBalancingScheme: 'EXTERNAL_MANAGED',
});

// http
const redirectMap = new gcp.compute.URLMap('redirect-map', {
  defaultUrlRedirect: {
    httpsRedirect: true,
    stripQuery: false,
    redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT',
  },
});

const httpProxy = new gcp.compute.TargetHttpProxy('http-proxy', {
  urlMap: redirectMap.id,
});

new gcp.compute.GlobalForwardingRule('http-rule', {
  target: httpProxy.id,
  ipAddress,
  portRange: '80',
  loadBalancingScheme: 'EXTERNAL_MANAGED',
});

export const imageName = image.imageName;
