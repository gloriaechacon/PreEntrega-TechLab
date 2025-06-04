import { argv } from "process";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { writeFile } from "fs/promises";

//Ubicacion de la carpeta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Obetener la ruta absoluta al archivo
const filePath = path.join(__dirname, "data", "products.json");

let [, , command, resource] = argv;


const match = argv.find((arg) => /^products\/\d+$/.test(arg));
//operation = match ? match.split("/")[0] : operation;
let id = match ? match.split("/")[1] : null;
id = parseInt(id);

let products = [];

try{
    const jsonText = await readFile(filePath, "utf-8");
    products = JSON.parse(jsonText);
} catch(error){
    console.log("Error leyendo el archivo JSON")
}

if(id){
    resource = resource.split("/")[0];
}

//Funciones

function addProduct(list, product, params){
    let newId;

    if(list.length < 1){
        newId = 1;
    } else {
        //Calculo el nuevo id por el id del ultimo producto en la lista
        newId = list[list.length-1].id + 1;
    }

    const newProduct = {
        id: newId,
        ...params,
    };
    
    list.push(newProduct);
}

function getDetails(product){
    return `ProductId: ${product.id}, Product: ${product.title} , price: $${product.price}, category: ${product.category}`;
}

function getList(){
    products.forEach((product) =>
        console.log(getDetails(product))
    )
}

async function updateProductFile(list){
    try {
        await writeFile(filePath, JSON.stringify(list));
        console.log("Archivo actualizado");
    } catch (error) {
        console.error("Error");
    }
}


if(command === "GET"){
    if (resource === "products" && id) {
        const product = products.find(product => product.id == id);

        if (product) {
            console.log(getDetails(product));
        } else {
            console.log("No se encontro producto");
        }
    } else if(resource === "products"){
        getList();
    }
} else if (command === "POST" && resource === "products") {
    let product;
    let [title, price, category] = argv.slice(4);
    price = parseInt(price);

    const params = { title, price, category};

    addProduct(products, product, params);

    await updateProductFile(products);
    
} else if(command === "DELETE" && resource === "products" && id){
    const productIndex = products.findIndex((product) => product.id == id);

    if(productIndex !== -1){
        const productDelete = products.splice(productIndex,1);
        console.log("Producto eliminado: ", productDelete[0]); 
        
        await updateProductFile(products);
    }
}