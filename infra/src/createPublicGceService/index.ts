import { createPublicGceService } from './createPublicGceService';

createPublicGceService({
  resourcePrefix: 'poc-compute-engine',
  image: {
    url: 'gcr.io/tat-den/poc-compute-engine:33',
  },
  containerPort: 3000,
  startTimeSec: 10,
  numberOfInstances: 1,
  healthCheck: {
    httpHealthCheck: {
      port: 3000,
      requestPath: '/healthz',
    },
  },
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
        role: 'roles/storage.objectViewer',
        project: 'tat-den',
      },
    ],
  },
});
