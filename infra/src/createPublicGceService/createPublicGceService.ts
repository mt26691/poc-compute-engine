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

export type Secret = {
  project: string;
  name: string;
};

export type Image = {
  url: string;
};

export type Instance = {
  baseName: string;
  roles: {
    role: string;
    project: string;
  }[];
};

type CreatePublicGceServiceParams = {
  resourcePrefix: string;
  image: Image;
  containerPort: number;
  initialStartupDelaySec: number;
  numberOfInstances: number;
  healthCheck: gcp.compute.HealthCheckArgs;
  secret: Secret;
  instance: Instance;
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
    roles: params.instance.roles,
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
    baseInstanceName: params.instance.baseName,
    containerPort: params.containerPort,
    numberOfInstances: params.numberOfInstances,
    initialStartupDelaySec: params.initialStartupDelaySec,
  });

  const backend = createBackend({
    resourcePrefix: params.resourcePrefix,
    healthCheck: params.healthCheck,
    instanceGroupManager,
  });

  return;

  const sslCertificate = createSslCertificate();

  createApplicationLoadBalancer({
    backend,
    sslCertificate,
  });
};
