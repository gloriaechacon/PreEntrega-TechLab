import { argv } from "process";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { writeFile } from "fs/promises";
import fetch from "node-fetch";

//Ubicacion de la carpeta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Obetener la ruta absoluta al archivo
const filePath = path.join(__dirname, "data", "products.json");

//Extraigo los argumentos del comando y el recurso/ruta
let [, , command, resource] = argv;

//Valido que el usuario ingreso comandos
if (!command) {
    console.log("Falta especificar un comando como GET o POST. Ejemplo npm run start GET products");
    process.exit(1);
}

const validCommands = ["GET", "POST", "DELETE"];

if(!validCommands.includes(command)){
    console.log("Debe ingresar comandos validos: GET, POST o DELETE");
    process.exit(1);
}

if (!resource) {
    console.log("Falta especificar la ruta. Ejemplo npm run start GET products");
    process.exit(1);
}

//Definición del product id, si es especificado en la ruta
let productId = null;

// Para aceptar tambien entradas como GET products/ o GET fakestore/ y devolver la lista
if (resource.endsWith("/")) {
    resource = resource.slice(0, -1);
}

if (resource.includes("/")) {
    const route = resource.split("/");
    resource = route[0]; //Toma si es products o fakestore
    const id = route[1];
    
    //Hago validacion por si no pasan un numero seguido del /
    if (!/^\d+$/.test(id)) {
        console.log("El Id debe ser un número positivo.");
        process.exit(1);
    }

    productId = parseInt(id);

    //Hago validacion para que el id que pasen no sea 0
    if (productId === 0) {
        console.log("El Id no puede ser cero");
        process.exit(1);
    }
}

//Defino y asigno mi lista de productos local del JSON
let products = [];

try{
    const jsonText = await readFile(filePath, "utf-8");
    products = JSON.parse(jsonText);
} catch(error){
    console.log("Error leyendo el archivo JSON")
}


//Funciones
//Añado un producto a mi lista con sus propiedades
function addProduct(list, params){
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
    console.log("Producto añadido: ", newProduct); 
}

//Devuelvo string con propiedades del producto
function getDetails(product){
    return `ProductId: ${product.id}, Product: ${product.title} , price: $${product.price}, category: ${product.category}`;
}

//Imprimo el detalle de mi lista
function getProductList(list){
    list.forEach((product) =>
        console.log(getDetails(product))
    )
}

//Actualizo mi archivo JSON
async function updateProductFile(list){
    try {
        await writeFile(filePath, JSON.stringify(list, null, 2));
        console.log("Archivo actualizado");
    } catch (error) {
        console.error("Error al escribir archivo", error.message);
    }
}


if(command === "GET"){
    //Utilizando mi archivo local
    if (resource === "products" && productId) {
        const product = products.find(product => product.id == productId);

        if (product) {
            console.log(getDetails(product));
        } else {
            console.log("No se encontro producto");
        }
    } else if (resource === "products") {
        getProductList(products);
    } 
    //Implementando fakestore, consultando api externa
    else if (resource === "fakestore" && productId) {
        //Si utilizo .then() y .catch()
        // fetch(`https://fakestoreapi.com/products/${productId}`)
        //     .then((response) => response.json())
        //     .then((product) => console.log(getDetails(product)))
        //     .catch((error) => console.error("Error al obtener producto:", error.message));

        //Utilizando async/await
        const res = await fetch(`https://fakestoreapi.com/products/${productId}`);
        const product = await res.json();
        console.log(getDetails(product));
    } else if (resource === "fakestore") {
        //Si utilizo .then() y .catch()
        // fetch("https://fakestoreapi.com/products")
        //     .then((response) => response.json())
        //     .then((data) => data.forEach((product) => console.log(getDetails(product))))
        //     .catch((error) => console.error("Error al obtener lista de productos:", error.message));

        //Utilizando async/await
        const response = await fetch("https://fakestoreapi.com/products");
        const data = await response.json();
        getProductList(data);

    }
    else{
        console.log("Comando inválido. Intente de nuevo con comando válido, ejemplo npm run start GET products ")
    }
} else if (command === "POST" && resource === "products") {
    const [title, priceAux, category] = argv.slice(4);

    //Verifico que esten los parametros para cargar un producto
    if (!title) {
        console.log("Debes ingresar el nombre del producto");
        process.exit(1);
    }

    if (!priceAux) {
        console.log("Debes ingresar el precio del producto");
        process.exit(1);
    }

    let price = parseFloat(priceAux);

    if (isNaN(price) || price < 0) {
        console.log("El precio debe ser un número válido");
        process.exit(1);
    }

    if (!category) {
        console.log("Debes ingresar la categoría del producto");
        process.exit(1);
    }

    const params = { title, price, category};

    addProduct(products, params);

    await updateProductFile(products);

} else if(command === "DELETE" && resource === "products" && productId){
    const productIndex = products.findIndex((product) => product.id == productId);

    if(productIndex !== -1){
        const productDelete = products.splice(productIndex,1);
        console.log("Producto eliminado: ", productDelete[0]); 
        
        await updateProductFile(products);
    }
    else{
        console.log("Producto no encontrado");
    }
} else if (command === "DELETE" && resource === "products" && !productId) {
    console.log("Debes especificar id para eliminar un producto. Ejemplo npm run start DELETE products/1");
    process.exit(1);
} else {
    console.log("Ingrese un comando válido, ejemplo npm run start GET products");
}