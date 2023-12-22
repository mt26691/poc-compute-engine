import { createPublicGceService } from './createPublicGceService';

const imageUrl = 'gcr.io/tat-den/poc-compute-engine:28';
const PORT = 3000;
const roles = [
  {
    role: 'roles/secretmanager.secretAccessor',
    project: 'chi-dau',
  },
  {
    role: 'roles/logging.logWriter',
    project: 'chi-dau',
  },
  {
    role: 'roles/storage.objectViewer',
    project: 'tat-den',
  },
];
const env = [
  {
    name: 'REVISION',
    value: imageUrl,
  },
  {
    name: 'PORT',
    value: String(PORT),
  },
];

createPublicGceService({
  resourcePrefix: 'poc-compute-engine',
  image: {
    url: imageUrl,
    context: '../server',
  },
  machineType: 't2d-standard-1',
  containerPort: PORT,
  initialStartupDelaySec: 30,
  numberOfInstances: 1,
  healthCheck: {
    httpHealthCheck: {
      port: PORT,
      requestPath: '/healthz',
    },
    checkIntervalSec: 10,
    healthyThreshold: 1,
    unhealthyThreshold: 1,
  },
  env,
  secret: {
    project: 'chi-dau',
    name: 'poc-compute-engine',
  },
  instance: {
    baseName: 'poc-compute-engine',
    roles,
  },
  domain: 'linhvuvan.com',
  managedZone: 'linhvuvan-com',
  project: 'chi-dau',
  region: 'us-central1',
});
