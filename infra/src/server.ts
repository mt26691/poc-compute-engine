import * as pulumi from '@pulumi/pulumi';
import { createPublicGceService } from './utils/createPublicGceService';
import { subscription, topic } from './pubsub';

const PORT = 3000;
const imageUrl = `gcr.io/tat-den/poc-compute-engine:16`;
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
  },
  secretData: pulumi.interpolate`
    PORT=${PORT}
    REVISION=${imageUrl}
    TOPIC_NAME=${topic.name}
    SUBSCRIPTION_NAME=${subscription.name}
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
  secretVolume: {
    name: 'env',
    hostPath: '/tmp/.env',
    mountPath: '/server/.env',
  },
});
