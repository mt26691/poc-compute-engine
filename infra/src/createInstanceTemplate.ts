import * as gcp from '@pulumi/gcp';
import { createInstanceMetadata } from './createInstanceMetadata';
import { Image } from '..';

type CreateInstanceTemplateParams = {
  network: gcp.compute.Network;
  subnetwork: gcp.compute.Subnetwork;
  serviceAccount: gcp.serviceaccount.Account;
  image: Image;
};

export const createInstanceTemplate = (
  params: CreateInstanceTemplateParams,
) => {
  const instanceTemplate = new gcp.compute.InstanceTemplate(
    'instance-template',
    {
      machineType: 'e2-standard-2',
      metadata: createInstanceMetadata({ image: params.image }),
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
        scopes: [],
      },
    },
  );

  return instanceTemplate;
};
