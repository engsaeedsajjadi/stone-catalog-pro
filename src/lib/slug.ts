export function slugify(value:string){return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{Letter}\p{Number}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,120)}
