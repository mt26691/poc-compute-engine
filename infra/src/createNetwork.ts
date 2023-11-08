import * as gcp from '@pulumi/gcp';

export const createNetwork = () => {
  const network = new gcp.compute.Network('network', {
    autoCreateSubnetworks: false,
  });

  new gcp.compute.Firewall('firewall', {
    network: network.selfLink,
    allows: [
      {
        protocol: 'tcp',
        ports: ['22', '80', '3000'],
      },
    ],
    direction: 'INGRESS',
    sourceRanges: ['0.0.0.0/0'],
  });

  return network;
};
