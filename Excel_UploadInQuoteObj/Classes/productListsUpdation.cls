public inherited sharing class productListsUpdation {
    @AuraEnabled
    public static void productListsUpdationMeth(ID quoteRecordId,List<List<String>> jsValues) {
        
        List<Trade_Opportunity_and_Product__c> needtobeupdated = new list<Trade_Opportunity_and_Product__c>();
        
        system.debug(quoteRecordId);
        ROXT_Quote__c OppId = [SELECT TOpportunity_Name__c FROM ROXT_Quote__c WHERE Id =: quoteRecordId LIMIT 1];
        
        set<string> jsProdValues = new set<string>();
        for (List<String> Li : jsValues) {
            jsProdValues.add(Li[0]);
        }
        
        map<String, ID> mapofprodandIDs = new map<String, ID>();
        list<ROXT_Product__c> Allprod = [SELECT ID, Name FROM ROXT_Product__c WHERE Name IN : jsProdValues];
        
        For(ROXT_Product__c val : Allprod){
            mapofprodandIDs.put(val.Name,val.Id);
        }
        
        For(List<String> Li : jsValues){
            If(mapofprodandIDs.containskey(Li[0])){
                Trade_Opportunity_and_Product__c p = new Trade_Opportunity_and_Product__c();
                system.debug(OppId.TOpportunity_Name__c);
                p.TROX_Opportunity__c = OppId.TOpportunity_Name__c;
                system.debug(mapofprodandIDs.get(Li[0]));
                p.TROX_Product__c = mapofprodandIDs.get(Li[0]);
                p.TQuantity__c = Integer.valueof(Li[1].trim());
                needtobeupdated.add(p);
            }
        }
        
        If(!needtobeupdated.isempty()){
            system.debug(needtobeupdated);
            Upsert needtobeupdated;
        }
        
    }
}