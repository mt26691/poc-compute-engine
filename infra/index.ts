import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as docker from '@pulumi/docker';

const APP_NAME = 'compute-engine-app';
const REVISION = 25;
const PORT = 3000;
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${APP_NAME}:${REVISION}`;
const START_TIME_SEC = 30;
const NUMBER_OF_ZONES = 4;
const MIN_REPLICAS = 2;
const MAX_REPLICAS = 2;

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

const containers = `
  spec:
    containers:
      - name: ${APP_NAME}
        image: ${IMAGE_REPOSITORY}
        stdin: false
        tty: false
    restartPolicy: Always
`;

const template = new gcp.compute.InstanceTemplate('instance', {
  machineType: 'e2-micro',
  metadata: {
    'gce-container-declaration': containers,
    'google-logging-enabled': 'true',
    'google-logging-use-fluentbit': 'true',
  },
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
    maxSurgeFixed: Math.max(MIN_REPLICAS, NUMBER_OF_ZONES),
    maxUnavailableFixed: 0,
  },
});

new gcp.compute.RegionAutoscaler('autoscaler', {
  target: group.id,
  autoscalingPolicy: {
    cooldownPeriod: START_TIME_SEC,
    minReplicas: MIN_REPLICAS,
    maxReplicas: MAX_REPLICAS,
    cpuUtilization: {
      target: 0.5,
    },
  },
});

const backend = new gcp.compute.BackendService('backend', {
  protocol: 'HTTP',
  healthChecks: health.id,
  backends: [
    {
      group: group.instanceGroup,
    },
  ],
});

const map = new gcp.compute.URLMap('map', {
  defaultService: backend.id,
});

const proxy = new gcp.compute.TargetHttpProxy('proxy', {
  urlMap: map.id,
});

const { address: ipAddress } = new gcp.compute.GlobalAddress('address');

new gcp.compute.GlobalForwardingRule('rule', {
  target: proxy.id,
  ipAddress,
  portRange: '80',
});

export const imageName = image.imageName;
