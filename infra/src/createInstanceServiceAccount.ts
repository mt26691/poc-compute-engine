import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

type CreateInstanceServiceAccountParams = {
  resourcePrefix: string;
  projectName: string;
  image: {
    projectName: string;
  };
};

export const createInstanceServiceAccount = (
  params: CreateInstanceServiceAccountParams,
) => {
  // const accountId = params.resourcePrefix;
  // const serviceAccount = new gcp.serviceaccount.Account(
  //   `${params.resourcePrefix}-service-account`,
  //   {
  //     accountId,
  //     displayName: accountId,
  //     project: params.projectName,
  //   },
  // );

  new gcp.projects.IAMBinding(`${params.resourcePrefix}-4`, {
    role: 'roles/storage.objectViewer',
    members: [
      pulumi.interpolate`serviceAccount:819423612556-compute@developer.gserviceaccount.com`,
    ],
    project: params.image.projectName,
  });

  // return serviceAccount;
};
