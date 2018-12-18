# Updating the Worker Nodegroup

Deploy a new worker node group using the following CloudFormation template:

```text
https://amazon-eks.s3-us-west-2.amazonaws.com/cloudformation/2018-12-10/amazon-eks-nodegroup.yaml
```

* Use the appropriate values to match your existing EKS cluster infrastructure.

* Specify the AMI for your desired Kubernetes version and AWS region. For Kubernetes 1.11.5 in `us-east-1`, I'll use this AMI:  `ami-0b4eb1d8782fc3aea`.

  * Refer to the following page to find the latest EKS AMI for your region: <https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-ami.html>

Record the **NodeInstanceRole**  for the node group that was created. (i.e. `arn:aws:iam::123456789012:role/upgrade-me-nodegroup-1-NodeInstanceRole-LHMLFEGOLPGU`)

Record the **NodeSecurityGroup** for the node group that was created (i.e. `sg-14cd6d6d4356fdd69`)

## Update the Security Group Ingress Rules

Update the security groups for both worker node groups so that they can communicate with each other.

Edit `update-ingress.sh`, specifying the CloudFormation stack names for the old and new node groups.

Execute the script:

```sh
./update-ingress.sh
```

## Edit the `aws-auth` ConfigMap

Edit the aws-auth configmap to map the new worker node instance role in RBAC:

```sh
kubectl edit configmap -n kube-system aws-auth
```

Add a new `mapRoles` entry for the new worker node group. Use the **NodeInstanceRole** value that you recorded previously, then save and close the file to apply the updated configmap.

## Drain the old worker nodes

Drain each of the nodes that you want to remove from your cluster with the following command:

```sh
kubectl drain <node_name> --ignore-daemonsets --delete-local-data
```

If there are pods belonging to a DaemonSet on the node, the drain command proceeds only if the `--ignore-daemonsets` flag is set.

We specify `--delete-local-data` to continue even if there are pods using `emptyDir` (local data that will be deleted when the node is drained).

## Revoke the ingress rules for the old node group

After your old worker nodes have finished draining, revoke the security group ingress rules you authorized earlier.

Edit `revoke-ingress.sh`, specifying the CloudFormation stack names for the old and new node groups.

Execute the script:

```sh
./revoke-ingress.sh
```

## Delete the old node group

Delete the CloudFormation stack for the old node group to terminate the instances.

## Remove the old worker nodes from RBAC

```sh
kubectl edit configmap -n kube-system aws-auth
```

Delete the `mapRoles` entry for the old worker node group.

Save and close the file to apply the updated configmap.
