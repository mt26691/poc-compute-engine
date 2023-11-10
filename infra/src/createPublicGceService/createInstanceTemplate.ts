import * as gcp from '@pulumi/gcp';
import { createInstanceMetadata } from './createInstanceMetadata';
import { Image, Secret } from './';

type CreateInstanceTemplateParams = {
  resourcePrefix: string;
  network: gcp.compute.Network;
  subnetwork: gcp.compute.Subnetwork;
  serviceAccount: gcp.serviceaccount.Account;
  image: Image;
  secret: Secret;
};

export const createInstanceTemplate = (
  params: CreateInstanceTemplateParams,
) => {
  const instanceTemplate = new gcp.compute.InstanceTemplate(
    `${params.resourcePrefix}-instance-template`,
    {
      machineType: 'e2-standard-2',
      metadata: createInstanceMetadata({
        resourcePrefix: params.resourcePrefix,
        image: params.image,
        secret: params.secret,
      }),
      disks: [
        { sourceImage: 'projects/cos-cloud/global/images/family/cos-stable' },
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
