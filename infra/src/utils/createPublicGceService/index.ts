import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { createInstanceServiceAccount } from './createInstanceServiceAccount';
import { createNetwork } from './createNetwork';
import { createSubnetwork } from './createSubnetwork';
import { createApplicationLoadBalancer } from './createApplicationLoadBalancer';
import { createBackend } from './createBackend';
import { createSslCertificate } from './createSslCertificate';
import { createInstanceGroupManager } from './createInstanceGroupManager';
import { createInstanceTemplate } from './createInstanceTemplate';
import { createDockerImage } from './createDockerImage';
import { createInstanceGroupInspector } from './createInstanceGroupInspector';
import { createSecret } from './createSecret';

export type Image = {
  url: string;
  context: string;
};

export type Env = {
  name: string;
  value: string;
};

export type Instance = {
  baseName: string;
  roles: {
    role: string;
    project: string;
  }[];
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
  domain: string;
  managedZone: string;
  env: Env[];
  project: string;
  region: string;
  machineType: string;
  secretData: SecretData;
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
  })

  const instanceTemplate = createInstanceTemplate({
    resourcePrefix: params.resourcePrefix,
    network,
    subnetwork,
    serviceAccount,
    image: params.image,
    secret,
    env: params.env,
    machineType: params.machineType,
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

  createInstanceGroupInspector({
    resourcePrefix: params.resourcePrefix,
    region: params.region,
    project: params.project,
    numberOfInstances: params.numberOfInstances,
    instanceTemplate: instanceTemplate,
    instanceGroupManager: instanceGroupManager,
    initialStartupDelaySec: params.initialStartupDelaySec,
  });

  const backend = createBackend({
    resourcePrefix: params.resourcePrefix,
    healthCheck: params.healthCheck,
    instanceGroupManager,
  });

  const sslCertificate = createSslCertificate({
    resourcePrefix: params.resourcePrefix,
    domain: params.domain,
    managedZone: params.managedZone,
  });

  createApplicationLoadBalancer({
    resourcePrefix: params.resourcePrefix,
    domain: params.domain,
    managedZone: params.managedZone,
    backend,
    sslCertificate,
  });
};
