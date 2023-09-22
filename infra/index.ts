import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as docker from '@pulumi/docker';

const IMAGE_NAME = 'compute-engine-app';
const REVISION = 3;
const IMAGE_REPOSITORY = `gcr.io/${gcp.config.project}/${IMAGE_NAME}:${REVISION}`;

const image = new docker.Image(IMAGE_NAME, {
  imageName: pulumi.interpolate`${IMAGE_REPOSITORY}`,
  build: {
    context: '../app',
    platform: 'linux/amd64',
  },
});

// VPC
const network = new gcp.compute.Network('network', {
  autoCreateSubnetworks: false,
});

const subnet = new gcp.compute.Subnetwork('subnet', {
  ipCidrRange: '10.0.1.0/24',
  network: network.id,
});

const firewall = new gcp.compute.Firewall('firewall', {
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

const startupScript = `
  #!/bin/bash
  sudo useradd -m linhvuvan2022
  sudo -u linhvuvan2022 docker-credential-gcr configure-docker
  sudo groupadd docker
  sudo usermod -aG docker linhvuvan2022
  sudo -u linhvuvan2022 docker run --name ${IMAGE_NAME} -d -p 80:3000 ${IMAGE_REPOSITORY}
  sudo -u linhvuvan2022 docker logs -f ${IMAGE_NAME}
`;

new gcp.compute.Instance(
  'instance',
  {
    machineType: 'e2-micro',
    zone: 'us-central1-a',
    metadataStartupScript: startupScript,
    bootDisk: {
      initializeParams: {
        image: 'projects/cos-cloud/global/images/family/cos-stable',
      },
    },
    networkInterfaces: [
      {
        network: network.id,
        subnetwork: subnet.id,
        accessConfigs: [{}],
      },
    ],
    serviceAccount: {
      email: '819423612556-compute@developer.gserviceaccount.com',
      scopes: [
        'https://www.googleapis.com/auth/devstorage.read_only',
        'https://www.googleapis.com/auth/logging.write',
        'https://www.googleapis.com/auth/monitoring.write',
        'https://www.googleapis.com/auth/service.management.readonly',
        'https://www.googleapis.com/auth/servicecontrol',
        'https://www.googleapis.com/auth/trace.append',
      ],
    },
  },
  { dependsOn: [firewall] },
);

export const imageName = image.imageName;
