import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { createInstanceMetadata } from './createInstanceMetadata';
import { Image } from './';
import { Secret } from './createInstanceMetadata';

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
  new gcp.projects.IAMMember(`${params.resourcePrefix}-iam-binding`, {
    role: 'roles/storage.objectViewer',
    member: pulumi.interpolate`serviceAccount:${params.serviceAccount.email}`,
    project: params.image.project,
  });

  const instanceTemplate = new gcp.compute.InstanceTemplate(
    `${params.resourcePrefix}-instance-template`,
    {
      machineType: 'e2-standard-2',
      metadata: createInstanceMetadata({
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
