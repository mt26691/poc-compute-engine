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
import { Secret } from './createInstanceMetadata';

export type Image = {
  name: string;
  url: string;
  project: string;
};

type CreatePublicGceServiceParams = {
  resourcePrefix: string;
  image: Image;
  containerPort: number;
  startTimeSec: number;
  numberOfInstances: number;
  project: string;
  healthCheck: gcp.compute.HealthCheckArgs;
  secret: Secret;
  baseInstanceName: string;
};

export const createPublicGceService = (
  params: CreatePublicGceServiceParams,
) => {
  const network = createNetwork({
    resourcePrefix: params.resourcePrefix,
  });
  const subnetwork = createSubnetwork({
    resourcePrefix: params.resourcePrefix,
    network,
  });

  createDockerImage({
    resourcePrefix: params.resourcePrefix,
    image: params.image,
  });

  const serviceAccount = createInstanceServiceAccount({
    resourcePrefix: params.resourcePrefix,
  });

  const instanceTemplate = createInstanceTemplate({
    resourcePrefix: params.resourcePrefix,
    network,
    subnetwork,
    serviceAccount,
    image: params.image,
    secret: params.secret,
  });

  const instanceGroupManager = createInstanceGroupManager({
    resourcePrefix: params.resourcePrefix,
    healthCheck: params.healthCheck,
    instanceTemplate: instanceTemplate,
    baseInstanceName: params.baseInstanceName,
    containerPort: params.containerPort,
    numberOfInstances: params.numberOfInstances,
    startTimeSec: params.startTimeSec,
  });

  return;

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
