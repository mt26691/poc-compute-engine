import * as gcp from '@pulumi/gcp';

export const createSubnetwork = (network: gcp.compute.Network) => {
  const subnet = new gcp.compute.Subnetwork('subnet', {
    ipCidrRange: '10.0.1.0/24',
    network: network.id,
  });

  return subnet;
};
