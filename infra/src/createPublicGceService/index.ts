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

type CreatePublicGceServiceParams = {
  image: Image;
  containerPort: number;
  startTimeSec: number;
  numberOfInstances: number;
  project: string;
  healthCheck: gcp.compute.HealthCheckArgs;
};

export const createPublicGceService = (params: CreatePublicGceServiceParams) => {
  const network = createNetwork();
  const subnetwork = createSubnetwork(network);

  createDockerImage({
    image: params.image,
  });

  return;

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
    containerPort: params.containerPort,
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
