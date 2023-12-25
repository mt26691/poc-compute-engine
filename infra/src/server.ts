import * as pulumi from '@pulumi/pulumi';
import { createPublicGceService } from './utils/createPublicGceService';

const PORT = 3000;
const imageUrl = `gcr.io/tat-den/poc-compute-engine:41`;
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
  secretData: pulumi.interpolate`
    PORT=${PORT}
    REVISION=${imageUrl}
  `,
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
