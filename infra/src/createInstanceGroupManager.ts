import * as gcp from '@pulumi/gcp';

type CreateInstanceGroupManagerParams = {
  healthCheck: gcp.compute.HealthCheckArgs;
  instanceTemplate: gcp.compute.InstanceTemplate;
  baseInstanceName: string;
  containerPort: number;
  numberOfInstances: number;
  startTimeSec: number;
};

export const createInstanceGroupManager = (
  params: CreateInstanceGroupManagerParams,
) => {
  const healthCheck = new gcp.compute.HealthCheck(
    'igm-health-check',
    params.healthCheck,
  );

  // instance group manager
  const instanceGroupManager = new gcp.compute.RegionInstanceGroupManager(
    'group',
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
        initialDelaySec: params.startTimeSec,
      },
      updatePolicy: {
        type: 'PROACTIVE',
        minimalAction: 'REPLACE',
        minReadySec: params.startTimeSec,
        maxSurgeFixed: Math.max(params.numberOfInstances, 4),
        maxUnavailableFixed: 0,
      },
      targetSize: params.numberOfInstances,
    },
  );

  return instanceGroupManager;
};
