import { createPublicGceService } from './createPublicGceService';
import { execSync } from 'child_process';

const PORT = 3000;
const revision = execSync('git rev-parse HEAD', { cwd: '../server' })
  .toString()
  .trim();
export const imageUrl = `gcr.io/tat-den/poc-compute-engine:${revision}`;
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
      value: revision,
    },
    {
      name: 'PORT',
      value: String(PORT),
    },
  ],
  secret: {
    project: 'chi-dau',
    name: serviceName,
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
    ],
  },
  domain: 'linhvuvan.com',
  managedZone: 'linhvuvan-com',
  project: 'chi-dau',
  region: 'us-central1',
});
