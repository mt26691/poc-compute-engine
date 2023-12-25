import compute from '@google-cloud/compute';
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { waitSec } from '../wait';

type CreateInstanceGroupInspectorParams = {
  resourcePrefix: string;
  region: string;
  project: string;
  numberOfInstances: number;
  initialStartupDelaySec: number;
  instanceTemplate: gcp.compute.InstanceTemplate;
  instanceGroupManager: gcp.compute.RegionInstanceGroupManager;
};

type InstanceGroupInspectorProps = Omit<
  CreateInstanceGroupInspectorParams,
  'resourcePrefix'
>;

type CheckAreAllInstancesHealthyProps = InstanceGroupInspectorProps & {
  instanceTemplate: string;
  instanceGroupManager: string;
};

const STATUS_CHECK_INTERVAL_SEC = 10;
const ONE_HOUR = 60 * 60;

async function checkAreAllInstancesHealthy(
  props: CheckAreAllInstancesHealthyProps
): Promise<void> {
  const client = new compute.RegionInstanceGroupManagersClient();
  let isHealthy = false;
  let attempts = 0;
  const maxAttempts = ONE_HOUR / STATUS_CHECK_INTERVAL_SEC;

  while (!isHealthy) {
    if (attempts > maxAttempts) {
      throw new Error(
        `Instance group manager ${props.instanceGroupManager} is not healthy after ${attempts} attempts`
      );
    }

    const [instances] = await client.listManagedInstances({
      project: props.project,
      region: props.region,
      instanceGroupManager: props.instanceGroupManager.split('/').pop(),
    });

    const newInstances = instances.filter(
      (instance) =>
        instance.version?.instanceTemplate?.includes(props.instanceTemplate)
    );

    isHealthy =
      newInstances.every(
        (instance) =>
          instance.instanceStatus === 'RUNNING' &&
          instance.currentAction === 'NONE'
      ) && newInstances.length === props.numberOfInstances;

    const isRecreating = newInstances.some(
      (instance) => instance.currentAction === 'RECREATING'
    );

    console.log(`Attempt no. ${attempts}`, {
      isHealthy,
      maxAttempts,
      instanceTemplate: props.instanceTemplate,
      instances,
      newInstances,
      timestamp: new Date().toISOString(),
    });

    if (isRecreating) {
      throw new Error(
        `Instances are unable to start and being recreated by the instance group manager ${props.instanceGroupManager}`
      );
    }

    if (!isHealthy) {
      await waitSec(STATUS_CHECK_INTERVAL_SEC);
    }

    attempts += 1;
  }
}

class InstanceGroupInspector extends pulumi.dynamic.Resource {
  constructor(
    name: string,
    props: InstanceGroupInspectorProps,
    opts?: pulumi.CustomResourceOptions
  ) {
    super(
      {
        create: async (inputs) => {
          await checkAreAllInstancesHealthy(inputs);

          return { id: name };
        },
        update: async (id, olds, news) => {
          await checkAreAllInstancesHealthy(news);

          return {
            outs: { id },
          };
        },
      },
      name,
      props,
      opts
    );
  }
}

export const createInstanceGroupInspector = (
  params: CreateInstanceGroupInspectorParams
) => {
  return new InstanceGroupInspector(
    `${params.resourcePrefix}-inspector`,
    params
  );
};
