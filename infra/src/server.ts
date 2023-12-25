import { createPublicGceService } from './utils/createPublicGceService';

const PORT = 3000;
const imageUrl = `gcr.io/tat-den/poc-compute-engine:40`;
export const serviceName = 'poc-compute-engine';

createPublicGceService({
  resourcePrefix: serviceName,
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
  env: [
    {
      name: 'REVISION',
      value: imageUrl,
    },
    {
      name: 'PORT',
      value: String(PORT),
    },
  ],
  secret: {
    project: 'chi-dau',
    name: 'linhvuvan',
  },
  instance: {
    baseName: serviceName,
    roles: [
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
      {
        role: 'roles/pubsub.publisher',
        project: 'chi-dau',
      },
      {
        role: 'roles/pubsub.subscriber',
        project: 'chi-dau',
      },
    ],
  },
  domain: 'linhvuvan.com',
  managedZone: 'linhvuvan-com',
  project: 'chi-dau',
  region: 'us-central1',
});
