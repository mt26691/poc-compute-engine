import { createPublicGceService } from './createPublicGceService';

const imageUrl = 'gcr.io/tat-den/poc-compute-engine:26';

createPublicGceService({
  resourcePrefix: 'poc-compute-engine',
  image: {
    url: imageUrl,
  },
  machineType: 't2d-standard-1',
  containerPort: 3000,
  initialStartupDelaySec: 30,
  numberOfInstances: 1,
  healthCheck: {
    httpHealthCheck: {
      port: 3000,
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
  ],
  secret: {
    project: 'chi-dau',
    name: 'poc-compute-engine',
  },
  instance: {
    baseName: 'poc-compute-engine',
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
    ],
  },
  domain: 'linhvuvan.com',
  managedZone: 'linhvuvan-com',
  project: 'chi-dau',
  region: 'us-central1',
});
