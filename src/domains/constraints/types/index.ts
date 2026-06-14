export interface DeploymentConstraint {
  id: string;
  organizationId: string;
  scope: string;
  constraintType: string;
  description: string;
  severity: string;
  createdAt: Date;
}

export interface ConstraintEntry {
  type: string;
  description: string;
}
