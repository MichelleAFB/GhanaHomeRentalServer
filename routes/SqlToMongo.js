router.get("/users",(req,res)=>{
  db.query("select * from ghanahomestay.users",(err,results)=>{
    results.map(async(m)=>{
      const user=new User({
        firstname:m.firstname,
        lastname:m.lastname,
        phone:m.phone,
        email:m.email,
        hash:m.hash,
        dateCreated:m.dateCreated,
        admin:m.admin
      })

      const us=await user.save()
      console.log(us)
    })
  })
})

router.get("/applications",(req,res)=>{
  db.query("select * from ghanahomestay.applications",(err,results)=>{
    results.map(async(u)=>{
      const application=new Application({
        firstname:u.firstname,
        middlename:u.middlename,
        lastname:u.lastname,
        phone:u.phone,
        email:u.email,
        stay_start_date:u.stay_start_date,
        stay_end_date:u.stay_end_date,
        no_adults:u.no_adults,
        no_children:u.no_children,
        dateReceived:u.dateReceived,
        notify_admin_message:u.notify_admin_message,
        no_occupants:u.no_occupants,
        notify_applicant:u.notify_applicant,
        notify_admin:u.notify_admin,
        application_status:u.application_status,
        approved:u.approved,
        dateApproved:u.dateApproved,
        confirmedApproved:u.confirmedApproved,
        dateReserved:u.dateReserved,
        dateDenied:u.dateDenied,
        datePaymentDue:u.datePaymentDue,
        notify_admin_message:u.notify_admin_message,
        notify_applicant_message:u.notify_applicant_message,
        datePaid:u.datePaid,
        currentlyOccupied:u.currentlyOccupied,
        checkoutTimeout:u.checkoutTimeout,
        review:u.review,
        paymentSessionUrl:u.paymentSessionUrl,
        checkedIn:u.checkedIn,
        timeCheckedIn:u.timeCheckedIn
      })
      const saved=await application.save()

      db.query("select * from ghanahomestay.application_review_images where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const review=new ApplicationReviewImage({
              application_id:saved.id,
              img_url:r.img_url
            })
            const rev=await review.save()
          })
        }
      })

      db.query("select * from ghanahomestay.booked_dates where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const booked=new BookedDate({
              application_id:saved.id,
              date:r.date
            })
            const boo=await booked.save()
          })
        }
      })

      db.query("select * from ghanahomestay.maintenance where application_id=?",u.id,(err1,results1)=>{
        if(err1){
          console.log(err1)
        }else{
          results1.map(async(r)=>{
            const maintenance=new Maintenance({
              application_id:saved.id,
              mechanism:r.mechanism,
              dateRecieved:r.dateRecieved,
              message:r.message,
              dateResolved:r.dataResolved,
              status:r.status,
            })
            console.log(maintenance)
            const main=await maintenance.save()
          })
        }
      })

      console.log(u.id)
   
      db.query("select * from ghanahomestay.application_occupants where application_id=?",u.id,(err1,results1)=>{
        
          if(err1){
            console.log(err1)

          }else{
            console.log(results1)
            results1.map(async(o)=>{
              
              const occupant=new ApplicationOccupant({
                firstname:o.firstname,
                lastname:o.lastname,
                age:o.age,
                association:o.association,
                application_id:saved.id,
                email:o.email,
                child:o.child
              })

              const occ=await occupant.save()
              console.log(occ)
              db.query("select * from ghanahomestay.application_restricted_individuals where occupant_id=?",o.id,(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }else{
                  console.log(results2)
                  results2.map(async(g)=>{
                        const restricted=new ApplicationRestrictedIndividual({
                          firstname:g.firstname,
                          lastname:g.lastname,
                          occupant_id:occ.id,
                          phone:g.phone,
                          email:g.email,
                          application_id:saved.id,
                          img_url:g.img_url
                        })
                        const restr=await restricted.save()
                        console.log(restr)
                  })
                }
              })

              db.query("select * from ghanahomestay.application_guests where occupant_id=?",o.id,(err2,results2)=>{
                if(err2){
                  console.log(err2)
                }else{
                  console.log(o.id)
                  console.log(results2)
                  results2.map(async(g)=>{
                        const guest=new ApplicationGuest({
                          firstname:g.firstname,
                          lastname:g.lastname,
                          occupant_id:occ.id,
                          phone:g.phone,
                          email:g.email,
                          application_id:saved.id
                        })
                        const gue=await guest.save()
                  })
                }
              })

            })
          }
        
      })
    })
  })
})