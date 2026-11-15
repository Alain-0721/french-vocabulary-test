// Supabase owns session persistence and renewal. No additional cookie copy is kept.
export async function restoreAuthSession(sdk){
 try{await sdk.refreshSession();}catch{}
 return sdk.getUser();
}
