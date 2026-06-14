export type CodeOwnerType = "user" | "team" | "email";

export type ParsedCodeOwner = {
  ownerType: CodeOwnerType;
  ownerName: string;
};

export type CodeownersRule = {
  pathPattern: string;
  owners: ParsedCodeOwner[];
};
