import requests, cgi, json,os


#temporary disable warning info in the requests
#requests.packages.urllib3.disable_warnings()
import warnings
warnings.filterwarnings("ignore")


#to avoid the error: You can change the cache directory by setting the PYTHON_EGG_CACHE environment variable to point to an accessible directory.
os.environ['PYTHON_EGG_CACHE'] = '/tmp'


print ""


#===========================================================================================
def googleLogin():
    
    #login and use google api
    p12=os.path.join(os.path.dirname(os.path.realpath(__file__)),"key1.pem") #"D:\\github\\hdma-dui\\ws\\key1.pem"
    
    import httplib2
    from apiclient.discovery import build
    from oauth2client.client import SignedJwtAssertionCredentials
     
    # Here's the file you get from API Console -> Service Account.
    with open(p12) as f:
        key=f.read()

     
    # Create an httplib2.Http object to handle our HTTP requests and authorize it
      # with the Credentials. Note that the first parameter, service_account_name,
      # is the Email address created for the Service account. It must be the email
      # address associated with the key that was created.
    credentials = SignedJwtAssertionCredentials(
        '641378541028-c8704toua3io13136uh9bio1mnln4289@developer.gserviceaccount.com',
        key,
        scope='https://www.googleapis.com/auth/fusiontables')
    http = httplib2.Http()
    http = credentials.authorize(http)
     
    return build("fusiontables", "v2", http=http)

    #print(googleService.query().sql(sql='SELECT * FROM 1gvB3SedL89vG5r1128nUN5ICyyw7Wio5g1w1mbk').execute())
#===========================================================================================


#update data
def updateData(form):
    import md5
    
    lic_nbr= form["lic_nbr"].value if form["lic_nbr"] is not None else "0100201100"
    updateData= form["rows"].value if form["rows"] is not None else None
    username= form["username"].value if form["username"] is not None else None
    password= form["password"].value if form["password"] is not None else None

    tableID="1kT9b0pA2m_J_dL0ARBuqZ5ZaOfFc9y7gblw9Ahzi" #"1Eg5WpSFKryXCs9PNfdTbeInw8tbnHLDBQCc-X3z3"
    apiKey="AIzaSyAqd6BFSfKhHPiGaNUXnSt6jAzQ9q_3DyU"
    tableID_account="1dcHBafxUnjkwRVokWA-6uztkb_ZE2YYDb5K0rWIo"

    #output
    output={"status":"error", "msg":""}

    
    if(lic_nbr is not None and updateData is not None):
        updateData=updateData.split("|")
        inputObject={}
        for r in updateData:
            t=r.split('===')
            inputObject[t[0]]=t[1]

        #get google API
        googleService=googleLogin()

        if(googleService is not None):
            #check username and password
            sql="SELECT password FROM " + tableID_account + " WHERE lic_lic_cert_nbr='"+username+"'"
            result=googleService.query().sql(sql=sql).execute()

            if(result is not None and result["rows"] is not None):
                pw=result["rows"][0][0]

                #check password
                if(password==md5.new(pw).hexdigest()):
                    #get rowdata
                    sql="SELECT * FROM " + tableID +" WHERE lic_lic_cert_nbr='"+username+"'"
                    rowData=googleService.query().sql(sql=sql).execute()

                    #get rowid
                    sql="SELECT ROWID FROM " + tableID +" WHERE lic_lic_cert_nbr='"+username+"'"
                    rowID=googleService.query().sql(sql=sql).execute()["rows"][0][0]
                    
                    
                    if(rowData is not None and rowID is not None):
                        #check each row if it is different with updateData
                        updates=[]
                        columns=rowData["columns"]
                        for i, row in enumerate(rowData["rows"][0]):
                            col=columns[i]
                            if col in inputObject:
                                if(str(inputObject[col])!=str(row)):
                                    updates.append(str(col) + "='" + inputObject[col]+"'")


                        #check if there is any updates from client sides   
                        if(len(updates)>0):
                            #make query sql
                            sql="UPDATE " + tableID +" SET " + ', '.join(updates) + " WHERE ROWID='"+ rowID +"'"
                            output["msg"]=googleService.query().sql(sql=sql).execute()
                            output["status"]="OK"
                        else:
                            output["msg"]="No values are changed! Please check again!"


    #output results
    return output
        

        
'''
        
        #query params
        params={
            "key": apiKey,
            "sql": "SELECT * FROM " + tableID +" WHERE lic_lic_cert_nbr="+lic_nbr+""
        }


        #get row data first
        r=requests.get("https://www.googleapis.com/fusiontables/v2/query", params=params, verify=False)
        rowData=r.json()

        #get row id
        params["sql"]="SELECT ROWID FROM " + tableID +" WHERE lic_lic_cert_nbr="+lic_nbr
        r=requests.get("https://www.googleapis.com/fusiontables/v2/query", params=params, verify=False)
        rowID=r.json()["rows"][0][0]
'''    

#===========================================================================================

#login
def login(form):
    import md5
    
    tableID="1dcHBafxUnjkwRVokWA-6uztkb_ZE2YYDb5K0rWIo"
    username= form["username"].value if form["username"] is not None else None
    password= form["password"].value if form["password"] is not None else None

    #output
    output={"username":username, "status":"error", "msg":"login error. Username or password is not correct! Please input again.", "login_times": 0 }

    if(password is not None and password <>""): 
        #query userAccount spreadsheet in the googld doc
        #beacuse the spreadsheet is private, we need to use google API to login and query
        #google login
        googleService=googleLogin()
                    
        #make query sql
        sql="SELECT lic_lic_cert_nbr, password, login_times, ROWID FROM " + tableID +" WHERE lic_lic_cert_nbr='" + username +"'"
        
        #query
        if(googleService is not None):
            result=googleService.query().sql(sql=sql).execute()

            #if username is in the spreadsheet >> check password
            if(result["rows"] is not None and len(result["rows"])==1):
                row=result["rows"]
                pw=row[0][1]
                pw=md5.new(pw).hexdigest()
                
                if(password==pw):
                    output["status"]="OK"
                    output["password"]=pw
                    output["msg"]="succeed"
                    

                    #update login time
                    login_times=int(row[0][2])+1
                    rowid=row[0][3]
                    sql="UPDATE "+tableID+" SET login_times="+str(login_times)+" WHERE ROWID='"+rowid+"'"
                    googleService.query().sql(sql=sql).execute()
                    
                    output["login_times"]=login_times
        
    return output

#===========================================================================================


#change password
def changePW(form):
    import md5
    
    tableID="1dcHBafxUnjkwRVokWA-6uztkb_ZE2YYDb5K0rWIo"
    username= form["username"].value if form["username"] is not None else None
    old_pw= form["oldPW"].value if form["oldPW"] is not None else None
    new_pw= form["newPW"].value if form["newPW"] is not None else None
    email= form["email"].value if form["email"] is not None else None

    #output
    output={"username":username, "status":"error", "msg":"" }
        
    if(new_pw is not None and new_pw!="" and email is not None and email <>"" and username is not None and username <>""):
        #query userAccount spreadsheet in the googld doc
        #beacuse the spreadsheet is private, we need to use google API to login and query
        #google login
        googleService=googleLogin()
                    
        #query
        if(googleService is not None):
            #make query sql
            sql="SELECT ROWID FROM "+ tableID +" WHERE lic_lic_cert_nbr='"+username+"'";
            result=googleService.query().sql(sql=sql).execute()
            
            if(result is not None and result["rows"] is not None and len(result["rows"])==1):
                rowid=result["rows"][0][0]

                output["msg"]=rowid
                if(rowid is not None):
                    sql="UPDATE " + tableID +" SET password='" + new_pw +"', input_email='"+email+"' WHERE ROWID='" + rowid +"'"
                    result=googleService.query().sql(sql=sql).execute()

                    output["msg"]=result
                    
                    if(result is not None):
                        if(result["rows"][0][0]=="1"):
                             output["status"]="OK"
                    
            else:
                output["msg"]="Cannot find a ROWID";
            

        
    return output

#===========================================================================================






#params from client request
form = cgi.FieldStorage()
serviceType=form["type"].value if form["type"] is not None else None
output={"error": "cannot execute !!"}


if(serviceType is not None):
    if(serviceType=='updateData'):
        output=updateData(form)
    if(serviceType=='login'):
        output=login(form)
    if(serviceType=="changePW"):
        output=changePW(form);

print json.dumps(output)
