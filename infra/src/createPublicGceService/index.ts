import * as gcp from '@pulumi/gcp';
import { createInstanceServiceAccount } from './createInstanceServiceAccount';
import { createNetwork } from './createNetwork';
import { createSubnetwork } from './createSubnetwork';
import { createApplicationLoadBalancer } from './createApplicationLoadBalancer';
import { createBackend } from './createBackend';
import { createSslCertificate } from './createSslCertificate';
import { createInstanceGroupManager } from './createInstanceGroupManager';
import { createInstanceTemplate } from './createInstanceTemplate';
import { createDockerImage } from './createDockerImage';

// const PORT = 3000;
// const START_TIME_SEC = 30;
// const NUMBER_OF_INSTANCES = 1;
// const CURRENT_PROJECT = 'linhvuvan-397815';
// const IMAGE_PROJECT = 'linhvuvan-image-holder';
// const healthCheck: gcp.compute.HealthCheckArgs = {
//   httpHealthCheck: {
//     port: PORT,
//     requestPath: '/healthz',
//   },
// };
// const image: Image = {
//   name: 'compute-engine-app',
//   url: `gcr.io/linhvuvan-image-holder/compute-engine-app:33`,
//   project: IMAGE_PROJECT,
// };

export type Image = {
  name: string;
  url: string;
  project: string;
};

type CreatePublicGceServiceParams = {
  image: Image;
  port: number;
  startTimeSec: number;
  numberOfInstances: number;
  project: string;
  healthCheck: gcp.compute.HealthCheckArgs;
};

export const main = (params: CreatePublicGceServiceParams) => {
  const network = createNetwork();
  const subnetwork = createSubnetwork(network);

  createDockerImage({
    image: params.image,
  });

  // wms
  const serviceAccount = createInstanceServiceAccount({
    project: params.project,
    image: params.image,
  });

  const instanceTemplate = createInstanceTemplate({
    network,
    subnetwork,
    serviceAccount,
    image: params.image,
  });

  const instanceGroupManager = createInstanceGroupManager({
    healthCheck: params.healthCheck,
    instanceTemplate: instanceTemplate,
    baseInstanceName: 'compute-engine-app',
    containerPort: params.port,
    numberOfInstances: params.numberOfInstances,
    startTimeSec: params.startTimeSec,
  });

  const backend = createBackend({
    healthCheck: params.healthCheck,
    instanceGroupManager,
  });

  const sslCertificate = createSslCertificate();

  createApplicationLoadBalancer({
    backend,
    sslCertificate,
  });
};
