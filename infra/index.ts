import { createPublicGceService } from './src/createPublicGceService';

createPublicGceService({
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
});
