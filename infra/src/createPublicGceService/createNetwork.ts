import * as gcp from '@pulumi/gcp';

type CreateNetworkParams = {
  resourcePrefix: string;
};

export const createNetwork = (params: CreateNetworkParams) => {
  const network = new gcp.compute.Network(`${params.resourcePrefix}-network`, {
    autoCreateSubnetworks: false,
  });

  new gcp.compute.Firewall(`${params.resourcePrefix}-firewall`, {
    network: network.selfLink,
    allows: [
      {
        protocol: 'tcp',
        ports: ['22', '80', '3000'],
      },
      {
        protocol: 'icmp',
      },
    ],
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
  });

  return network;
};
