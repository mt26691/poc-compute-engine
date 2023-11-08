import * as gcp from '@pulumi/gcp';
import { createInstanceMetadata } from './createInstanceMetadata';

type CreateInstanceTemplateParams = {
  network: gcp.compute.Network;
  subnetwork: gcp.compute.Subnetwork;
  serviceAccount: gcp.serviceaccount.Account;
};

export const createInstanceTemplate = (
  params: CreateInstanceTemplateParams,
) => {
  const instanceTemplate = new gcp.compute.InstanceTemplate(
    'instance-template',
    {
      machineType: 'e2-standard-2',
      metadata: createInstanceMetadata(),
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
