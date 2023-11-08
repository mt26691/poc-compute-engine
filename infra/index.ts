import * as gcp from '@pulumi/gcp';
import { createInstanceServiceAccount } from './src/createInstanceServiceAccount';
import { createNetwork } from './src/createNetwork';
import { createSubnetwork } from './src/createSubnetwork';
import { createApplicationLoadBalancer } from './src/createApplicationLoadBalancer';
import { createBackend } from './src/createBackend';
import { createSslCertificate } from './src/createSslCertificate';
import { createInstanceGroupManager } from './src/createInstanceGroupManager';
import { createInstanceTemplate } from './src/createInstanceTemplate';
import { createDockerImage } from './src/createDockerImage';

export type Image = {
  name: string;
  url: string;
  project: string;
};

const PORT = 3000;
const START_TIME_SEC = 30;
const NUMBER_OF_INSTANCES = 1;
const CURRENT_PROJECT = 'linhvuvan-397815';
const IMAGE_PROJECT = 'linhvuvan-image-holder';
const healthCheck: gcp.compute.HealthCheckArgs = {
  httpHealthCheck: {
    port: PORT,
    requestPath: '/healthz',
  },
};
const image: Image = {
  name: 'compute-engine-app',
  url: `gcr.io/linhvuvan-image-holder/compute-engine-app:33`,
  project: IMAGE_PROJECT,
};

const main = () => {
  const network = createNetwork();
  const subnetwork = createSubnetwork(network);

  createDockerImage({ image });

  // wms
  const serviceAccount = createInstanceServiceAccount({
    project: CURRENT_PROJECT,
    image,
  });

  const instanceTemplate = createInstanceTemplate({
    network,
    subnetwork,
    serviceAccount,
    image,
  });

  return;
  const instanceGroupManager = createInstanceGroupManager({
    healthCheck,
    instanceTemplate: instanceTemplate,
    baseInstanceName: 'compute-engine-app',
    containerPort: PORT,
    numberOfInstances: NUMBER_OF_INSTANCES,
    startTimeSec: START_TIME_SEC,
  });

  const backend = createBackend({
    healthCheck,
    instanceGroupManager,
  });

  const sslCertificate = createSslCertificate();

  createApplicationLoadBalancer({
    backend,
    sslCertificate,
  });
};

main();
