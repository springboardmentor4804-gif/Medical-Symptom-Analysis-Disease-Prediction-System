import { Mail, Phone, MapPin } from "lucide-react";


export default function Contact(){

return(

<section id="contact" className="py-20 bg-white">

<div className="max-w-6xl mx-auto px-6">


<h2 className="text-4xl font-bold text-center text-gray-800">
Contact Us
</h2>


<p className="text-center text-gray-600 mt-4">
Have questions? We are here to help.
</p>



<div className="grid md:grid-cols-3 gap-8 mt-12">


<div data-aos="fade-up"
className="p-6 shadow rounded-xl text-center">

<Mail 
size={40}
className="mx-auto text-blue-600"
/>

<h3 className="font-semibold mt-4  text-gray-900">
Email
</h3>

<p className="text-gray-600">
support@medassistai.com
</p>

</div>



<div data-aos="fade-left"
className="p-6 shadow rounded-xl text-center">

<Phone
size={40}
className="mx-auto text-blue-600"
/>

<h3 className="font-semibold mt-4 text-gray-900">
Phone
</h3>

<p className="text-gray-600">
+91 98765 43210
</p>

</div>



<div data-aos="fade-up"
className="p-6 shadow rounded-xl text-center">

<MapPin
size={40}
className="mx-auto text-blue-600"
/>

<h3 className="font-semibold mt-4 text-gray-900">
Location
</h3>

<p className="text-gray-600">
India
</p>

</div>


</div>

</div>

</section>

);

}