import { Main } from "@daml.js/healthcare-claims-processing";
import { useStreamQueries } from "@daml/react";

//hook to stream all policy data and return a key map
export const useKeyedPolicies = () => {
  const disclosed = useStreamQueries(Main.Policy.DisclosedPolicy).contracts;

  return new Map(disclosed.map((p) => [p.contractId, p]));
};
