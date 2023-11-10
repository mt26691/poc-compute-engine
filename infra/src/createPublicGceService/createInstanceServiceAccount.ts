import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { Image } from './';

type CreateInstanceServiceAccountParams = {
  resourcePrefix: string;
  project: string;
  image: Image;
};

export const createInstanceServiceAccount = (
  params: CreateInstanceServiceAccountParams,
) => {
  const serviceAccount = new gcp.serviceaccount.Account(
    `${params.resourcePrefix}-service-account`,
    {
      accountId: 'linvuvan',
      displayName: 'linhvuvan',
      project: params.project,
    },
  );

  new gcp.projects.IAMBinding(`${params.resourcePrefix}-iam-binding`, {
    role: 'roles/storage.objectViewer',
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
    project: params.image.project,
  });

  return serviceAccount;
};
