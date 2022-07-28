export interface OpportunityMinimal {
  title: string;
}

export interface Opportunity extends OpportunityMinimal {
  id: bigint;
  created_at: Date;
}

// export type Opportunity = OpportunityMinimal | OpportunityMaximal;
