import * as gcp from '@pulumi/gcp';
import { APP_NAME, createInstanceMetadata } from './src/createInstanceMetadata';
import { createInstanceServiceAccount } from './src/createInstanceServiceAccount';
import { createNetwork } from './src/createNetwork';
import { createSubnetwork } from './src/createSubnetwork';
import { createApplicationLoadBalancer } from './src/createApplicationLoadBalancer';
import { createBackend } from './src/createBackend';

const PORT = 3000;
const START_TIME_SEC = 30;
const NUMBER_OF_ZONES = 4;
const NUMBER_OF_INSTANCES = 1;

// VPC
const network = createNetwork();
const subnet = createSubnetwork(network);

const serviceAccount = createInstanceServiceAccount({
  project: 'linhvuvan-397815',
  image: {
    project: 'linhvuvan-image-holder',
  },
});

// instance template
const template = new gcp.compute.InstanceTemplate('instance-template', {
  machineType: 'e2-standard-2',
  metadata: createInstanceMetadata(),
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
    email: serviceAccount.email,
    scopes: ['cloud-platform'],
  },
});

const health = new gcp.compute.HealthCheck('health', {
  httpHealthCheck: {
    port: PORT,
    requestPath: '/healthz',
  },
});

// instance group manager
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

const backend = createBackend({
  healthCheck: {
    httpHealthCheck: {
      port: PORT,
      requestPath: '/healthz',
    },
  },
  instanceGroupManager: group,
});

const sslCertificate = new gcp.compute.ManagedSslCertificate(
  'managed-ssl-certificate',
  {
    name: 'linhvuvan-com',
    managed: {
      domains: ['linhvuvan.com'],
    },
  },
);

createApplicationLoadBalancer({
  backend,
  sslCertificate,
});
