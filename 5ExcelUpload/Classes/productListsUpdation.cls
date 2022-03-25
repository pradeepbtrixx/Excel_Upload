public inherited sharing class productListsUpdation {
    @AuraEnabled
    public static void productListsUpdationMeth(ID oppRecordId,List<List<String>> jsValues) {
        
        List<Trade_Opportunity_and_Product__c> needtobeupdated = new list<Trade_Opportunity_and_Product__c>();
        
        system.debug(oppRecordId);
        
        set<string> jsProdValues = new set<string>();
        for (List<String> Li : jsValues) {
            jsProdValues.add(Li[0]);
        }
        
        map<String, ID> mapofprodandIDs = new map<String, ID>();
        list<ROXT_Product__c> Allprod = [SELECT ID, Name FROM ROXT_Product__c WHERE Name IN : jsProdValues];
        
        For(ROXT_Product__c val : Allprod){
            mapofprodandIDs.put(val.Name,val.Id);
        }
        
        List<Trade_Opportunity_and_Product__c> existingProductListinOpp = [SELECT  ID, TROX_Product__r.Name,TQuantity__c, Current_Selling_Price__c FROM Trade_Opportunity_and_Product__c WHERE TROX_Opportunity__c =: oppRecordId];
		set<string>  existingproductname = new set<string>();
        For(Trade_Opportunity_and_Product__c epp : existingProductListinOpp){
            existingproductname.add(epp.TROX_Product__r.Name);
        }
        
        For(List<String> Li : jsValues){
            If(mapofprodandIDs.containskey(Li[0])){
                
                If(existingproductname.contains(Li[0])){
                    For(Trade_Opportunity_and_Product__c ep : existingProductListinOpp){
                        If(ep.TROX_Product__r.Name == Li[0]){
                            ep.TQuantity__c = Integer.valueof(Li[1].trim());
                            ep.Current_Selling_Price__c = Decimal.valueof(Li[2].trim());
                            needtobeupdated.add(ep);
                        }
               		}
                }
                else{
                    Trade_Opportunity_and_Product__c p = new Trade_Opportunity_and_Product__c();
                    p.TROX_Opportunity__c = oppRecordId;
                    p.TROX_Product__c = mapofprodandIDs.get(Li[0]);
                    p.TQuantity__c = Integer.valueof(Li[1].trim());
                    p.Current_Selling_Price__c = Decimal.valueof(Li[2].trim());
                    needtobeupdated.add(p);
                }
                
                
            }
        }
        
        If(!needtobeupdated.isempty()){
            system.debug(needtobeupdated);
            Upsert needtobeupdated;
        }
        
    }
}