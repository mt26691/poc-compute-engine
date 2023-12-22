import * as gcp from '@pulumi/gcp';

type CreateSubnetworkParams = {
  network: gcp.compute.Network;
  resourcePrefix: string;
};

export const createSubnetwork = (params: CreateSubnetworkParams) => {
  const subnet = new gcp.compute.Subnetwork(
    `${params.resourcePrefix}-subnetwork`,
    {
      ipCidrRange: '10.0.1.0/24',
      network: params.network.id,
    },
  );

  return subnet;
};
