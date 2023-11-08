import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

type CreateInstanceServiceAccountParams = {
  project: string;
  image: {
    project: string;
  };
};

export const createInstanceServiceAccount = (
  params: CreateInstanceServiceAccountParams,
) => {
  const serviceAccount = new gcp.serviceaccount.Account('service-account', {
    accountId: 'linvuvan',
    displayName: 'linhvuvan',
    project: params.project,
  });

  new gcp.projects.IAMBinding('iam-binding', {
    role: 'roles/storage.objectViewer',
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
    project: params.image.project,
  });

  return serviceAccount;
};
