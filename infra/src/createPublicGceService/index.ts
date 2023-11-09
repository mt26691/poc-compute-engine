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
