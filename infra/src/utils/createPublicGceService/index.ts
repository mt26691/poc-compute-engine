import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { createInstanceServiceAccount } from './createInstanceServiceAccount';
import { createNetwork } from './createNetwork';
import { createSubnetwork } from './createSubnetwork';
import { createApplicationLoadBalancer } from './createApplicationLoadBalancer';
import { createBackend } from './createBackend';
import { createSslCertificates } from './createSslCertificates';
import { createInstanceGroupManager } from './createInstanceGroupManager';
import { createInstanceTemplate } from './createInstanceTemplate';
import { createDockerImage } from './createDockerImage';
import { createSecret } from './createSecret';

export type Image = {
  url: string;
  context: string;
};

export type Instance = {
  baseName: string;
  roles: {
    role: string;
    project: string;
  }[];
};

export type SecretVolume = {
  name: string;
  hostPath: string;
  mountPath: string;
};

export type SecretData = pulumi.Output<string>;

type CreatePublicGceServiceParams = {
  resourcePrefix: string;
  image: Image;
  containerPort: number;
  initialStartupDelaySec: number;
  numberOfInstances: number;
  healthCheck: gcp.compute.HealthCheckArgs;
  instance: Instance;
  domains: string[];
  managedZone: string;
  project: string;
  region: string;
  machineType: string;
  secretData: SecretData;
  secretVolume: SecretVolume;
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

  const secret = createSecret({
    resourcePrefix: params.resourcePrefix,
    secretData: params.secretData,
  });

  const instanceTemplate = createInstanceTemplate({
    resourcePrefix: params.resourcePrefix,
    network,
    subnetwork,
    serviceAccount,
    image: params.image,
    secret,
    machineType: params.machineType,
    secretVolume: params.secretVolume,
  });

  const instanceGroupManager = createInstanceGroupManager({
    resourcePrefix: params.resourcePrefix,
    healthCheck: params.healthCheck,
    instanceTemplate: instanceTemplate,
    baseInstanceName: params.instance.baseName,
    containerPort: params.containerPort,
    numberOfInstances: params.numberOfInstances,
    initialStartupDelaySec: params.initialStartupDelaySec,
    region: params.region,
  });

  const backend = createBackend({
    resourcePrefix: params.resourcePrefix,
    healthCheck: params.healthCheck,
    instanceGroupManager,
  });

  const sslCertificates = createSslCertificates({
    resourcePrefix: params.resourcePrefix,
    domains: params.domains,
  });

  createApplicationLoadBalancer({
    resourcePrefix: params.resourcePrefix,
    domain: params.domains[0],
    managedZone: params.managedZone,
    backend,
    sslCertificates,
  });
};
