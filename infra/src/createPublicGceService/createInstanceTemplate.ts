import * as gcp from '@pulumi/gcp';
import { createInstanceMetadata } from './createInstanceMetadata';
import { Env, Image, Secret } from './createPublicGceService';

type CreateInstanceTemplateParams = {
  resourcePrefix: string;
  network: gcp.compute.Network;
  subnetwork: gcp.compute.Subnetwork;
  serviceAccount: gcp.serviceaccount.Account;
  image: Image;
  secret: Secret;
  env: Env[];
  machineType: string;
};

export const createInstanceTemplate = (
  params: CreateInstanceTemplateParams,
) => {
  const instanceTemplate = new gcp.compute.InstanceTemplate(
    `${params.resourcePrefix}-instance-template`,
    {
      machineType: params.machineType,
      metadata: createInstanceMetadata({
        resourcePrefix: params.resourcePrefix,
        image: params.image,
        secret: params.secret,
        env: params.env,
      }),
      disks: [
        {
          sourceImage: 'projects/cos-cloud/global/images/family/cos-109-lts',
        },
      ],
      networkInterfaces: [
        {
          network: params.network.id,
          subnetwork: params.subnetwork.id,
          accessConfigs: [{}],
        },
      ],
      serviceAccount: {
        email: params.serviceAccount.email,
        scopes: ['cloud-platform'],
      },
    },
  );

  return instanceTemplate;
};
