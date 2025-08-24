import random
from typing import List, Tuple

def init_population(available_cars: List[int], number_of_request: int, population_size:int) -> List[List[int]]:
    """chromosome = [dept1, dept2, return1, return2, ...]"""
    return [random.choices(available_cars, k=number_of_request) for _ in range(population_size)]

def roulette_wheel_selection(population: List[List[int]], fitnesses: List[float]) -> List[int]:
    total_fitness = sum(fitnesses)
    pick = random.uniform(0, total_fitness)
    current = 0
    for individual, fitness in zip(population, fitnesses):
        current += fitness
        if current > pick:
            return individual
    return population[0] # prevent no return value

def crossover(chromosome1: List[int], chromosome2: List[int], crossover_rate: float = 0.8) -> Tuple[List[int],List[int]]:
    """Return 2 chromosome"""
    if random.random() < crossover_rate:
        chromosome_length = len(chromosome1)
        point1 = random.randint(0, chromosome_length - 2)
        point2 = random.randint(point1 + 1, chromosome_length - 1)
        n_chromosome1 = (chromosome1[:point1] + chromosome2[point1:point2] + chromosome1[point2:])
        n_chromosome2 = (chromosome2[:point1] + chromosome1[point1:point2] + chromosome2[point2:])
        return n_chromosome1, n_chromosome2
    else:
        return chromosome1, chromosome2

def mutation(population: List[List[int]], available_cars: List[int], mutation_rate: float = 0.1) -> List[List[int]]:
    """Return population"""
    for chromosome in population:
        for i in range(len(chromosome)):
            if random.random() < mutation_rate:
                chromosome[i] = random.choice(available_cars)
    return population

def next_population(population: List[List[int]], fitnesses: List[float], available_cars: List[int],
                    crossover_rate: float, mutation_rate: float, elitism: float = 1) -> List[List[int]]:
    population_size = len(population)
    new_population = []
    for i in range(elitism):
        elite = sorted(zip(population, fitnesses), key=lambda x: x[1])[i][0] #may need reverse = True deping on fitness func
        new_population.append(elite)

    while len(new_population) < population_size:
        parent1 = roulette_wheel_selection(population, fitnesses)
        parent2 = roulette_wheel_selection(population, fitnesses)
        new_chromosome1, new_chromosome2 = crossover(parent1,parent2,crossover_rate)
        new_population.extend([new_chromosome1, new_chromosome2])

    new_population = mutation(new_population,available_cars,mutation_rate)    
    return new_population[:population_size]

# request = [[pick_up_time_dept, pick_up_time_return, origin, destination, passenger, luggage]]
# request sort by time

def fitness(chromosome: List[List[int]], requests: List[List[int]],available_cars: List[List[int]]):
    time_table = [[] for _ in available_cars]
    car_index_map = {car_id: idx for idx, car_id in enumerate(available_cars)} #map car index to time_table index
    half_point_of_chromosome = len(chromosome) // 2
    for index,gene in enumerate(chromosome):
        time_table_index = car_index_map[gene]
        requests_index = index % half_point_of_chromosome
        task_value = requests[requests_index][0]
        time_table[time_table_index].append(task_value)
    return 0
