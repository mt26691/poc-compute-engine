import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import {
  APP_NAME,
  buildMetadata,
  buildStartupScript,
} from './src/buildMetadata';

const PORT = 3000;
const START_TIME_SEC = 30;
const NUMBER_OF_ZONES = 4;
const NUMBER_OF_INSTANCES = 0;
// const MIN_REPLICAS = 1;
// const MAX_REPLICAS = 1;

const config = new pulumi.Config('poc-compute-engine');

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

const startupScript = buildStartupScript({
  DB_PASSWORD: config.getSecret('dbPassword'),
});

const template = new gcp.compute.InstanceTemplate('instance-template', {
  machineType: 'e2-micro',
  metadata: buildMetadata({ startupScript }),
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

// autoscaler
// new gcp.compute.RegionAutoscaler('autoscaler', {
//   target: group.id,
//   autoscalingPolicy: {
//     cooldownPeriod: START_TIME_SEC,
//     minReplicas: MIN_REPLICAS,
//     maxReplicas: MAX_REPLICAS,
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

// dns
new gcp.dns.RecordSet('record-set', {
  managedZone: 'linhvuvan-com',
  name: 'linhvuvan.com.',
  type: 'A',
  rrdatas: [ipAddress],
  ttl: 300,
});
