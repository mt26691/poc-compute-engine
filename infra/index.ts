import { createPublicGceService } from './src/createPublicGceService';

createPublicGceService({
  resourcePrefix: 'poc-compute-engine',
  image: {
    name: 'poc-compute-engine',
    url: 'gcr.io/tat-den/poc-compute-engine:33',
    project: 'tat-den',
  },
  containerPort: 3000,
  startTimeSec: 10,
  numberOfInstances: 1,
  project: 'chi-dau',
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
  baseInstanceName: 'poc-compute-engine',
});
