import * as gcp from '@pulumi/gcp';
import { Wait } from './Wait';

type CreateInstanceGroupManagerParams = {
  resourcePrefix: string;
  healthCheck: gcp.compute.HealthCheckArgs;
  instanceTemplate: gcp.compute.InstanceTemplate;
  baseInstanceName: string;
  containerPort: number;
  numberOfInstances: number;
  initialStartupDelaySec: number;
  project: string;
  region: string;
};

export const createInstanceGroupManager = (
  params: CreateInstanceGroupManagerParams,
) => {
  const healthCheck = new gcp.compute.HealthCheck(
    `${params.resourcePrefix}-igm-health-check`,
    params.healthCheck,
  );

  const instanceGroupManager = new gcp.compute.RegionInstanceGroupManager(
    `${params.resourcePrefix}-igm`,
    {
      region: 'us-central1',
      versions: [
        {
          instanceTemplate: params.instanceTemplate.id,
        },
      ],
      baseInstanceName: params.baseInstanceName,
      namedPorts: [
        {
          name: 'http',
          port: params.containerPort,
        },
      ],
      autoHealingPolicies: {
        healthCheck: healthCheck.id,
        initialDelaySec: params.initialStartupDelaySec,
      },
      updatePolicy: {
        type: 'PROACTIVE',
        minimalAction: 'REPLACE',
        minReadySec: params.initialStartupDelaySec,
        maxSurgeFixed: Math.max(params.numberOfInstances, 4),
        maxUnavailableFixed: 0,
      },
      targetSize: params.numberOfInstances,
    },
  );

  new Wait(`${params.resourcePrefix}-wait`, {
    instanceTemplate: params.instanceTemplate,
    numberOfInstances: params.numberOfInstances,
    instanceGroupManager,
    region: params.region,
    project: params.project,
  });

  return instanceGroupManager;
};
