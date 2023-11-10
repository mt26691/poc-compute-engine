import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { Instance } from '.';

type CreateInstanceServiceAccountParams = {
  resourcePrefix: string;
  roles: Instance['roles'];
};

export const createInstanceServiceAccount = (
  params: CreateInstanceServiceAccountParams,
) => {
  const serviceAccount = new gcp.serviceaccount.Account(
    `${params.resourcePrefix}-service-account`,
    {
      accountId: params.resourcePrefix,
      displayName: params.resourcePrefix,
    },
  );

  for (const [i, role] of params.roles.entries()) {
    new gcp.projects.IAMMember(`${params.resourcePrefix}-iam-binding-${i}`, {
      role: role.role,
      member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
      project: role.project,
    });
  }

  return serviceAccount;
};
